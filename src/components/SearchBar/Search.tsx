import React from 'react';
import * as RN from 'react-native';
import { Pad, PadService } from '../../service/service';
import { CloseIcon } from '../SVG/CloseIcon';
import { SearchIcon } from '../SVG/SearchIcon';

import * as S from './Search.styled';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { RegularText, Title } from '../Basic/Basic';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../hooks/useStore';
import { RecentSearchItem } from './RecentSearchItem';

const { height: dh } = RN.Dimensions.get('screen');

const MIN_HEIGHT = dh * 0.15;
const MAX_HEIGHT = dh * 0.8;

const springConfig: Animated.WithSpringConfig = {
  velocity: 10,
  damping: 100,
  stiffness: 500,
};

interface Props {
  onChangeItem: (item: Pad) => void;
}

export const Search = (props: Props) => {
  const { t } = useTranslation();

  const store = useStore();
  let recentSearches = store.recentSearches ? store.recentSearches.filter(s => s.type === 'pad') : null;

  const [searchValue, setSearchValue] = React.useState('');
  const [value, setValue] = React.useState('');
  const [, setModalVisible] = React.useState(false);

  const [data, setData] = React.useState<null | Pad[]>(null);

  const height = useSharedValue(MIN_HEIGHT);

  React.useEffect(() => {
    store.loadSearches();
  }, []);

  React.useEffect(() => {
    if (!searchValue.length) {
      return;
    }

    store.addRecentSearch({ text: searchValue, type: 'pad' });

    PadService.padList({ limit: 15, search: searchValue }).then((res) => {
      console.warn(res);

      setData(res.results);
    });
  }, [searchValue]);

  const onItemPress = (item: Pad) => {
    props.onChangeItem(item);
    onBoxPress();
  };

  const onFocus = () => {
    setModalVisible(true);
  };

  const [boxIsOpen, setBoxIsOpen] = React.useState(false);

  const onBoxPress = () => {
    if (!data?.length && !store.recentSearches?.length) {
      return;
    }

    if (height.value > MIN_HEIGHT) {
      height.value = withSpring(MIN_HEIGHT, springConfig);
      setBoxIsOpen(false);
    } else {
      height.value = withSpring(MAX_HEIGHT, springConfig);
      setBoxIsOpen(true);
    }
  };

  const stylez = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  }, []);

  let searchResultTextShort = t('noSearchResults');

  if (data && (data?.length || 0) === 1) {
    searchResultTextShort = `1 ${t('result')}`;
  } else if (data && (data?.length || 0) > 1) {
    searchResultTextShort = `${data.length} ${t('results')}`;
  } else if (recentSearches?.length) {
    searchResultTextShort = t('recentSearches');
  }

  return (
    <>
      <RN.View
        style={[
          {
            flexDirection: 'row',
            borderRadius: 100,
            width: '90%',
            margin: 16,
            alignItems: 'center',
            paddingHorizontal: 16,
            backgroundColor: 'white',
          },
          styles.shadow,
        ]}>
        <SearchIcon />

        <RN.TextInput
          pointerEvents="box-only"
          onFocus={onFocus}
          value={value}
          onChangeText={setValue}
          onEndEditing={(e) => setSearchValue(e.nativeEvent.text)}
          style={[
            {
              flex: 1,
              minHeight: 50,
              marginHorizontal: 8,
            },
          ]}
        />

        <CloseIcon />
      </RN.View>

      <RN.View
        pointerEvents="box-none"
        style={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%',
          width: '100%',
        }}>
        <S.StyledSearchResultsWrapper
          pointerEvents="auto"
          style={[styles.shadow, stylez]}>
          {!boxIsOpen && (
            <RN.TouchableOpacity
              activeOpacity={1}
              onPress={onBoxPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}>
              <S.StyledSearchResultsPullBar />

              <RN.View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  marginTop: 16,
                  justifyContent: 'flex-start',
                }}>
                <Title size="xl">{searchResultTextShort}</Title>
              </RN.View>
            </RN.TouchableOpacity>
          )}

          {boxIsOpen && !data?.length && recentSearches?.length && (
            <>
              <Title size="xl">{searchResultTextShort}</Title>

              <RN.FlatList
                data={recentSearches}
                alwaysBounceVertical={false}
                style={{ flex: 1, width: '100%', marginTop: 24 }}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <RN.View style={{ height: 1, width: '100%', backgroundColor: 'rgba(0,0,0,.01)'}} /> }
                keyExtractor={(i) => String(i.text || '1')}
                renderItem={(item) => {
                  return (
                    <RecentSearchItem
                      onPress={() => {
                        setSearchValue(item.item.text);
                      }}
                      onRemoveItem={() => {
                        store.removeRecentSearch(item.item)
                      }}
                      text={item.item.text}
                    />
                  );
                }}
              />
            </>
          )}

          {boxIsOpen && data?.length && (
            <RN.FlatList
              data={data}
              style={{ flex: 1, width: '100%', marginTop: 24 }}
              showsVerticalScrollIndicator={false}
              keyExtractor={(i) => String(i.id || '1')}
              renderItem={(item) => {
                return (
                  <RN.TouchableOpacity
                    style={{ marginVertical: 24 }}
                    onPress={() => {
                      onItemPress(item.item);
                    }}>

                    <RegularText>{JSON.stringify(item.item)}</RegularText>
                  </RN.TouchableOpacity>
                );
              }}
            />
          )}
        </S.StyledSearchResultsWrapper>
      </RN.View>
    </>
  );
};

const Sep = () => {
  return <RN.View style={{ width: '100%', height: 2, backgroundColor: 'red'}} />
}

const styles = RN.StyleSheet.create({
  shadow: {
    elevation: 7,
    shadowColor: '#999999',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});